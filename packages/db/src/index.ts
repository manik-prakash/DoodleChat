import { PrismaClient } from "@prisma/client"
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
console.log(process.env.DATABASE_URL);

// const prismaClientSingleton = () => {
//     return new PrismaClient;
// }

// type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

// const globalForPrisma = globalThis as unknown as {
//     prisma: PrismaClientSingleton | undefined;
// };

// const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

const prisma = new PrismaClient({
  adapter,
});

export default prisma;

// if (process.env.NODE_ENV !== 'production') {
//     globalForPrisma.prisma = prisma;
// }