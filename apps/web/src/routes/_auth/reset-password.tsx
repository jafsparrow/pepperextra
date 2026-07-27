import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ResetPasswordForm } from "@/feature/auth/ui/components/reset-password-form"
import { useMutation } from "@tanstack/react-query"
import { orpc } from "@/shared/utils/orpc"

export const Route = createFileRoute("/_auth/reset-password")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const resetMutation = useMutation(
    orpc.user.changeOwnPassword.mutationOptions({
      onSuccess: () => {
        navigate({ to: "/" })
      },
      onError: (error) => console.log(error),
    }),
  )

  return (
    <ResetPasswordForm
      onSubmit={({ currentPassword, newPassword }) =>
        resetMutation.mutate({ currentPassword, newPassword })
      }
    />
  )
}
