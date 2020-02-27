import useStore from './useStore'
import { Store } from 'relite'

export type Selector<S extends {}> = (state: S) => any

export type EqualityFun = <T = unknown>(a: T, b: T) => boolean

const refEquality: EqualityFun = <T>(a: T, b: T) => a === b

function createSubscription(store: Store<S, any>) {
  return 
}

function createUseModelState() {
  let subscription = createSubscription(useStore<{}, {}>())

  function useUseModelStateWithSubscription<S extends {}>(store: Store<S, any>) {

  }
  
  return function <S extends {}>(
    selector: Selector<S>,
    isEqual: EqualityFun = refEquality
  ) {
    const store = useStore<S, any>()
  
    return 
  }
}

