import { createFileRoute } from "@tanstack/react-router"
import { signIn } from "@pepperextra/auth/client"
import { LoginForm } from "@/feature/auth/ui/components/login-form"

export const Route = createFileRoute("/_auth/login")({
  component: RouteComponent,
})

function RouteComponent() {
  const handleLogin = async () => {
    const { error, data } = await signIn.email({
      email: "user@example.com",
      password: "password",
    })
  }
  return <LoginForm />
}
