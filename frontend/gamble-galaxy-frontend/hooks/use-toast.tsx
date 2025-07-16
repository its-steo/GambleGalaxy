export function useToast() {
  return {
    toast: ({ title, description, variant = "default" }: any) => {
      alert(`${title}\n${description}`)
    },
  }
}
