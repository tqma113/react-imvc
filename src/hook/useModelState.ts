import useCtrl from './useCtrl'
import Controller from '../controller/index'

export default function<S extends {}>() {
  let ctrl = useCtrl<Controller<S, any>>()
  return ctrl.store.getState()
}
