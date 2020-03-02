import Controller from '../../../../src/controller'
import React from 'react'
import { Location, Context } from '../../../../src/'
import { useModelActions, useSelector } from '../../../../src/hook'
import * as Model from './Model'

type Actions = Omit<typeof Model, 'initialState'>

class Hook extends Controller<Model.State, Actions> {
  View = View
  Model = Model

  constructor(location: Location, context: Context) {
    super(location, context)
  }

  handleUpdate1Click = () => {
    this.store.actions.UPDATE_BASE()
  }
}

export default Hook

const View = React.memo(function View() {
  // let ctrl = useCtrl<Hook>()
  // let actions = useModelActions<Model.State, Actions>()
  // let state = useModelState<Model.State>()
  // const handleUpdate2Click = () => {
  //   actions.UPDATE_BASE()
  // }
	return (
    <div id="hook">
      <div>
        {/* <p id="foo">{state.base}</p>
        <p id="foo">{ctrl.store.getState().foo}</p>
        <button id="update1" onClick={ctrl.handleUpdate1Click}>Update</button>
        <button id="update2" onClick={handleUpdate2Click}>Update</button> */}
      </div>
      <Foo />
      <Bar />
      <Baz />
    </div>
  )
})

const Foo = React.memo(function Foo() {
  const actions = useModelActions<Model.State, Actions>()
  const selector = (state: Model.State) => state.foo
  const foo = useSelector(selector)
  console.log("Foo update")
  return (
    <div>
      <p>Foo: {foo}</p>
      <button onClick={() => actions.UPDATE_FOO()}>Update</button>
    </div>
  )
})

const Bar = React.memo(function Bar() {
  const actions = useModelActions<Model.State, Actions>()
  const selector = (state: Model.State) => state.bar
  const bar = useSelector(selector)
  console.log("Bar update")
  return (
    <div>
      <p>Bar: {bar}</p>
      <button onClick={() => actions.UPDATE_BAR()}>Update</button>
    </div>
  )
})

const Baz = React.memo(function Baz() {
  const actions = useModelActions<Model.State, Actions>()
  const selector = (state: Model.State) => state.baz
  const baz = useSelector(selector)
  console.log("Baz update")
  return (
    <div>
      <p>Baz: {baz}</p>
      <button onClick={() => actions.UPDATE_BAZ()}>Update</button>
    </div>
  )
})