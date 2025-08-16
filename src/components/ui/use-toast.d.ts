declare module '@/components/ui/use-toast' {
  export function useToast(): {
    toasts: Array<{
      id: string
      title?: string
      description?: string
      action?: any
      [key: string]: any
    }>
  }
}
