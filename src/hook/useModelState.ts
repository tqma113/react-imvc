import useSelector from './useSelector'

export default function useModelState<S extends {}>() {
  return useSelector<S, S>()
}
