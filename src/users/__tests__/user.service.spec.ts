import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import {
  CreateUserDto,
  Currency,
  Language,
  User,
  UserRole,
} from "@tonightpass/shared-types";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connect, Connection, Model, set } from "mongoose";
import { NotificationService } from "src/notifications/notification.service";

import { UserSchema } from "../schemas/user.schema";
import { UserService } from "../user.service";

describe("UserService", () => {
  let userService: UserService;
  let mongod: MongoMemoryServer;
  let mongoConn: Connection;

  const birthDateMock = new Date();
  const mockCreateUserDto: CreateUserDto = {
    identifier: {
      email: "test@example.com",
      phoneNumber: "+33615856245",
      username: "johndoe",
    },
    password: "Abc12345678",
    identity: {
      firstName: "John",
      lastName: "Doe",
      gender: "male",
      profilePictureUrl: "http://localhost.com/profile-picture.png",
      birthDate: birthDateMock,
    },
    addresses: [
      {
        name: "my company",
        address: "1 code's street",
        city: "City",
        country: "State",
        zipCode: "12345",
      },
    ],
  };

  const notificationService = {
    subscribeNewsletter: jest.fn().mockImplementation((_) => true),
    unsubscribeNewsletter: jest.fn().mockImplementation((_) => true),
    sendWelcomeEmail: jest.fn().mockImplementation((_) => true),
  };

  let userModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    set("strictQuery", false);

    const uri = mongod.getUri();
    mongoConn = (await connect(uri)).connection;

    userModel = mongoConn.model("User", UserSchema);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        NotificationService,
        { provide: getModelToken("User"), useValue: userModel },
      ],
    })
      .overrideProvider(NotificationService)
      .useValue(notificationService)
      .compile();

    userService = moduleRef.get<UserService>(UserService);
  });

  afterAll(async () => {
    await mongoConn.dropDatabase();
    await mongoConn.close();
    await mongod.stop();
  });

  afterEach(async () => {
    const collections = mongoConn.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  it("should be defined", () => {
    expect(userService).toBeDefined();
  });

  /**
   *
   * USER CREATION
   *
   */
  describe("create", () => {
    /**
     * @Given a valid user object
     * @When calling the `createUser` function with the user object
     * @Then verify that the user is successfully created in the database, and the function returns the created user object.
     */
    it("should create a new user", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      expect(newUser).toMatchObject({
        id: newUser.id,
        identifier: {
          email: "test@example.com",
          phoneNumber: "+33615856245",
          username: "johndoe",
        },
        identity: {
          firstName: "John",
          lastName: "Doe",
          fullName: "John Doe",
          gender: "male",
          profilePictureUrl: "http://localhost.com/profile-picture.png",
          birthDate: birthDateMock,
          idValid: false,
        },
        role: UserRole.USER.toString(),
        addresses: [
          {
            name: "my company",
            address: "1 code's street",
            city: "City",
            country: "State",
            zipCode: "12345",
          },
        ],
        preferences: {
          currency: Currency.EUR,
          language: Language.FR,
          notifications: {
            email: {
              message: true,
              newsletter: true,
            },
            push: {
              message: true,
            },
          },
        },
        connections: [],
        createdAt: newUser.createdAt,
      });
    });
  });

  describe("search", () => {
    it("should search unknown email user", async () => {
      await userService.create(mockCreateUserDto);

      const users: User[] = await userService.search({
        identifier: { email: "unknown@example.com" },
      });

      expect(users).toBeDefined();
      expect(users).toHaveLength(0);
      expect(users).toStrictEqual([]);
    });

    it("should search user with correct email", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      const users: User[] = await userService.search({
        identifier: { email: newUser.identifier.email },
      });

      expect(users).toBeDefined();
      expect(users).toHaveLength(1);
      expect(users).toStrictEqual([newUser]);
    });

    it("should search user with unknown phone nomber", async () => {
      const users: User[] = await userService.search({
        identifier: { phoneNumber: "0123456789" },
      });

      expect(users).toBeDefined();
      expect(users).toHaveLength(0);
      expect(users).toStrictEqual([]);
    });

    it("should search user with correct phone number", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      const users: User[] = await userService.search({
        identifier: { phoneNumber: newUser.identifier.phoneNumber },
      });

      expect(users).toBeDefined();
      expect(users).toHaveLength(1);
      expect(users).toStrictEqual([newUser]);
    });

    it("should search user with correct identifiers", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      const users: User[] = await userService.search({
        identifier: newUser.identifier,
      });

      expect(users).toBeDefined();
      expect(users).toHaveLength(1);
    });

    it("should search user with 1/2 correct identifiers", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      newUser.identifier.email = "unknown@example.com";

      const users: User[] = await userService.search({
        identifier: newUser.identifier,
      });

      expect(users).toBeDefined();
      expect(users).toHaveLength(0);
      expect(users).toStrictEqual([]);
    });
  });

  describe("compareEncryptedPassword", () => {
    it("should validate with right password", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      const isMatch = await userService.compareEncryptedPassword.bind(
        userService,
      )(newUser.id, mockCreateUserDto.password);

      expect(isMatch).toBe(true);
    });

    it("should not pass with an invalid password", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      const isMatch = await userService.compareEncryptedPassword.bind(
        userService,
      )(newUser.id, `invalid-${mockCreateUserDto.password}`);

      expect(isMatch).toBe(false);
    });

    it("should not pass with an empty password", async () => {
      const newUser: User = await userService.create(mockCreateUserDto);

      const isMatch = await userService.compareEncryptedPassword.bind(
        userService,
      )(newUser.id, "");

      expect(isMatch).toBe(false);
    });
  });
});
