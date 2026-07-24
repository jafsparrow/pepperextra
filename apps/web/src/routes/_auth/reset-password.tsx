import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ResetPasswordForm } from "@/feature/auth/ui/components/reset-password-form"
import { useMutation } from "@tanstack/react-query"

export const Route = createFileRoute("/_auth/reset-password")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()

  const resetMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string
      newPassword: string
      verifyPassword: string
    }) => {
      // Replace with real API call to reset/change password.
      console.log("reset password payload:", data)
    },
    onSuccess: () => {
      navigate({ to: "/login" })
    },
    onError: (error) => console.log(error),
  })

  return (
    <ResetPasswordForm
      onSubmit={({ currentPassword, newPassword, verifyPassword }) =>
        resetMutation.mutate({ currentPassword, newPassword, verifyPassword })
      }
    />
  )
}
