import { useMutation } from "@tanstack/react-query"

import { orpc } from "@/lib/orpc"

/** Change the current user's password from the settings screen. */
export function useChangePassword() {
  const mutation = useMutation(
    orpc.user.changeOwnPassword.mutationOptions({
      onError: (error) => console.log(error),
    }),
  )

  return {
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      mutation.mutateAsync(input).then(() => true).catch(() => false),
    isPending: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  }
}
