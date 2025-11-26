import { authenticate } from "../shopify.server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const action = async ({ request }) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    const body = await request.json();
    let { cartToken, customerId, email } = body;

    // Extract token + key
    let cleanToken = cartToken.split("?")[0];
    let cartKey = cartToken.includes("?key=")
      ? cartToken.split("?key=")[1]
      : null;

    await prisma.cartSession.create({
      data: {
        storeId: shop,
        cartId: cleanToken,
        cartKey,
        customerId,
        email
      }
    });

    return Response.json({
      success: true,
      message: "Saved cart session",
      cartId: cleanToken,
      cartKey,
      customerId,
      email,
      storeId: shop
    });

  } catch (err) {
    return Response.json({
      success: false,
      error: err.message
    });
  }
};

