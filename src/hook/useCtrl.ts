import { useContext } from 'react'
import GlobalContext from '../context'
import Controller from '../controller/index'

export default function useCtrl<S extends {} = {}, AS extends {} = {}>() {
  let { ctrl } = useContext(GlobalContext)
  return ctrl as Controller<S, AS>
}