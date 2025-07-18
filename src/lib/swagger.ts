import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  try {
    const spec = createSwaggerSpec({
      apiFolder: "pages/api",
      definition: {
        openapi: "3.0.0",
        info: {
          title: "orb-games Referral API",
          version: "1.0.0",
          description: "API for orb games Telegram mini app with TON Connect integration",
        },
        components: {
          securitySchemes: {
            BearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
        security: [],
      },
    });
    return spec;
  } catch (error) {
    
    throw new Error(`Error generating Swagger spec: ${error}`);
  }
};