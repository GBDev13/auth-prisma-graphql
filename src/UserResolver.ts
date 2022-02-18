import { compare, hash } from "bcryptjs";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { Context } from "./context";
import { User } from "./User";
import { v4 as uuid } from "uuid";

@InputType()
class UserInputData {
  @Field()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
class UserWithToken {
  @Field()
  user: User;

  @Field()
  token: string;
}

@Resolver()
export class UserResolver {
  @Query((returns) => User, { nullable: true })
  async privateInfo(
    @Arg("token") token: string,
    @Ctx() ctx: Context
  ): Promise<User | null> {
    const dbToken = await ctx.prisma.tokens.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken) return null;

    const { user } = dbToken;
    return user;
  }

  @Mutation((returns) => User)
  async signUp(
    @Arg("data") data: UserInputData,
    @Ctx() ctx: Context
  ): Promise<User> {
    const hashedPass = await hash(data.password, 10);
    return await ctx.prisma.users.create({
      data: {
        ...data,
        password: hashedPass,
      },
    });
  }

  @Mutation((returns) => UserWithToken)
  async login(
    @Arg("data") data: UserInputData,
    @Ctx() ctx: Context
  ): Promise<{ user: User; token: string } | null> {
    const user = await ctx.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (!user) return null;

    const validation = await compare(data.password, user.password);

    if (!validation) return null;

    const tokenCode = uuid();

    const token = await ctx.prisma.tokens.create({
      data: {
        token: tokenCode,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });

    return { user, token: token.token };
  }
}
