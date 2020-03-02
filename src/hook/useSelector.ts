import { useMemo, useRef, useEffect } from "react"
import { Store } from "relite"
import useCtrl from "./useCtrl"
import { isFunction } from "util"

export type Pair = [any, (state: any) => void]

export type Listener<R> = (pair: Pair, state: R) => void

export type Selector<S extends {}, R> = (state: S) => R

export type EqualityFun<T> = (a: T, b: T) => boolean

const identify = <S>(state: any) => state as S

const refEquality = <T>(a: T, b: T) => a === b

function useSelectorWithStore<S extends {}, R>(
  selector: Selector<S, R>,
  isEqual: EqualityFun<R>,
  useStore: () => Store<S, any>
) {
  const store = useStore()
  const currentSelectedState = useRef(selector(store.getState()))
  const setSelectedState = (state: R) => currentSelectedState.current = state

  let selectedState: R = currentSelectedState.current

  const unsubscribe = useMemo(() => {
    return store.subscribe((data) => {
      const newSelectedState = selector(data.currentState)
      if (!isEqual(newSelectedState, currentSelectedState.current)) {
        setSelectedState(newSelectedState)
      }
    })
  }, [store.getState()])

  useEffect(() => {
    selectedState = currentSelectedState.current
  }, [currentSelectedState.current])

  useEffect(() => {
    return () => unsubscribe()
  }, [store])

  return selectedState
}

function createSelectorHook() {
  const useStore = () => {
    const { store } = useCtrl()
    return store
  }
  return <S extends {}, R>(
    selector: Selector<S, R> = identify,
    isEqual: EqualityFun<R> = refEquality
  ) => {
    if (!isFunction(selector)) {
      throw new Error("参数必须是一个function")
    }
    return useSelectorWithStore<S, R>(selector, isEqual, useStore)
  }
}

const useSelector = createSelectorHook()

export default useSelector