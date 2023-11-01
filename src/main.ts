import fastifyCookie from "@fastify/cookie";
import fastifyCsrf from "@fastify/csrf-protection";
import helmet from "@fastify/helmet";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.init();

  const configService = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: configService.get<string>("CORS_ORIGIN"),
    credentials: true,
  });

  await app.register(fastifyCookie, {
    secret: configService.get("COOKIE_SECRET"),
  });
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });
  await app.register(fastifyCsrf);

  const port = configService.get("PORT");
  const interfaces = configService.get("INTERFACE");

  await app.listen(port, interfaces);
}
bootstrap();
