import { BaseState, Action } from '../../../../src'

export type State = BaseState & {
  foo?: string
}

export const initialState = {}

export const UPDATE_FOO: Action<State, string> = (state, foo) => {
  return {
    ...state,
    foo
  }
}