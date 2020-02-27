import useCtrl from './useCtrl'

export default function useStore<S, AS>() {
  const ctrl = useCtrl<S, AS>()
  return ctrl.store
}