import useCtrl from './useCtrl'

export default function<S extends {} = {}, AS extends {} = {}>() {
  const { store } = useCtrl<S, AS>()
  return store.actions
}
