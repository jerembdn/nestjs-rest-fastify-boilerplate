import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Location as SharedLocation } from "@tonightpass/shared-types";

class Geometry {
  latitude: number;
  longitude: number;
}

@Schema({
  toObject: {
    virtuals: true,
    versionKey: false,
  },
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
  id: false,
  _id: false,
})
class Location implements SharedLocation {
  @Prop({
    type: String,
    required: false,
  })
  name?: string;

  @Prop({
    type: String,
    validators: {
      validate: () => true,
    },
    required: true,
  })
  address: string;

  @Prop({
    type: String,
    match: /^([A-Z][0-9][A-Z][0-9][A-Z][0-9]|\d{5})$/g,
    required: true,
  })
  zipCode: string;

  @Prop({
    type: String,
    required: true,
  })
  city: string;

  @Prop({
    type: String,
    required: true,
  })
  country: string;

  @Prop({
    type: Geometry,
    required: false,
  })
  geometry?: Geometry;
}

export const LocationSchema = SchemaFactory.createForClass<Location>(Location);
