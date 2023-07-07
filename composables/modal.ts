const DEFAULT_MODAL: InjectionKey<Ref<boolean>> = Symbol()

type Modal = {
  visible: Ref<boolean>
  show: () => void
  dismiss: () => void
}

export const useModal = (injectionKey: string | InjectionKey<Ref<boolean>> = DEFAULT_MODAL): Modal => {
  const visible = inject(
    injectionKey,
    () => {
      const visible = ref<boolean>(false)
      provide(injectionKey, visible)
      return visible
    },
    true
  )

  const show = () => (visible.value = true)
  const dismiss = () => (visible.value = false)

  return { visible: readonly(visible), show, dismiss }
}
