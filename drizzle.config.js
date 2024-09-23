/** @type { import("drizzle-kit").Config } */
export default {
    schema: "./utils/schema.js",
    dialect: 'postgresql',
    dbCredentials: {
      url: 'postgresql://mock-interviewer_owner:hHbw5d8jyqPi@ep-damp-wildflower-a1b45gwy.ap-southeast-1.aws.neon.tech/mock-interviewer?sslmode=require',
    }
  };