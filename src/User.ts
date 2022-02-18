import { IsEmail } from "class-validator";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class User {
  @Field((type) => ID)
  id: string;

  @Field()
  @IsEmail()
  email: string;

  @Field((type) => String)
  password: string;

  @Field((type) => Date)
  createdAt: Date;
}
