import { getChatGPTUser, requireChatGPTUser } from "./chatgpt-auth";
import { PDFWorkbench } from "./workbench";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user =
    process.env.NODE_ENV === "development"
      ? ((await getChatGPTUser()) ?? {
          displayName: "Local preview",
          email: "preview@local",
          fullName: "Local preview",
        })
      : await requireChatGPTUser("/");

  return <PDFWorkbench user={user} />;
}
