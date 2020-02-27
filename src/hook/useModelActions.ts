import useStore from './useStore'

export default function<S extends {} = {}, AS extends {} = {}>() {
  const store = useStore<S, AS>()
  return store.actions
}
