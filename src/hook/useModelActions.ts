import useCtrl from './useCtrl'
import Controller from '../controller/index'

export default function<S extends {} = {}, AS extends {} = {}>() {
  const { store } = useCtrl<Controller<S, AS>>()
  return store.actions
}
