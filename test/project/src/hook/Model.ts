import { BaseState, Action } from '../../../../src'

export type State = BaseState & {
  base: number,
  foo: number,
  bar: number,
  baz: number
}

export const initialState = {
  base: 0,
  foo: 0,
  bar: 0,
  baz: 0
}

export const UPDATE_BASE: Action<State> = (state) => {
  return {
    ...state,
    base: state.base + 1
  }
}

export const UPDATE_FOO: Action<State> = (state) => {
  return {
    ...state,
    foo: state.foo + 1
  }
}

export const UPDATE_BAR: Action<State> = (state) => {
  return {
    ...state,
    bar: state.bar + 1
  }
}

export const UPDATE_BAZ: Action<State> = (state) => {
  return {
    ...state,
    baz: state.baz + 1
  }
}