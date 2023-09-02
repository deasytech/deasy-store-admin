import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import prismadb from "@/lib/prismadb";
import { priceFormatter } from "@/lib/utils";

import { OrderClient } from "./compoents/client";
import { OrderColumns } from "./compoents/columns";

interface OrderPageProps {
  params: {
    storeId: string;
  };
}

const OrderPage: React.FC<OrderPageProps> = async ({ params }) => {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const store = await prismadb.store.findFirst({
    where: { id: params.storeId, userId },
  });

  if (!store) {
    redirect("/");
  }

  const orders = await prismadb.order.findMany({
    where: { storeId: params.storeId },
    include: {
      orderItems: {
        include: {
          product: true,
        }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedOrders: OrderColumns[] = orders.map((item) => ({
    id: item.id,
    phone: item.phone,
    isPaid: item.isPaid,
    address: item.address,
    products: item.orderItems.map((item) => item.product.name).join(', '),
    totalPrice: priceFormatter.format(item.orderItems.reduce((total, item) => {
      return total + Number(item.product.price)
    }, 0)),
    createdAt: format(item.createdAt, "MMMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <OrderClient data={formattedOrders} />
      </div>
    </div>
  );
};

export default OrderPage;
