import { useMemo, useState, useEffect } from "react"
import { Store } from "relite"
import useCtrl from "./useCtrl"
import { isFunction } from "util"

export type Selector<S extends {}, R> = (state: S) => R

export type EqualityFun<T> = (a: T, b: T) => boolean

const identify = <S>(state: any) => state as S

const refEquality = <T>(a: T, b: T) => a === b

function useSelectorWithStore<S extends {}, R>(
  selector: Selector<S, R>,
  isEqual: EqualityFun<R>,
  store: Store<any, any>
) {
  const [selectState, setSelectState] = useState(selector(store.getState()))

  const unsubscribe = useMemo(() => {
    return store.subscribe(() => {
      const state = store.getState()
      const newSelectState = selector(state)
      if (!isEqual(newSelectState, selectState)) {
        setSelectState(newSelectState)
      }
    })
  }, [store])

  useEffect(() => {
    return () => unsubscribe()
  }, [])

  return selectState
}

function createSelectorHook() {
  return <S extends {}, R>(
    selector: Selector<S, R> = identify,
    isEqual: EqualityFun<R> = refEquality
  ) => {
    const { store } = useCtrl()
    if (!isFunction(selector)) {
      throw new Error("参数必须是一个function")
    }
    return useSelectorWithStore<S, R>(selector, isEqual, store)
  }
}

const useSelector = createSelectorHook()

export default useSelector
