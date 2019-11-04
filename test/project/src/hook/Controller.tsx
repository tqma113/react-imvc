import Controller from '../../../../src/controller'
import React from 'react'
import { Location, Context } from '../../../../src/'
import { useCtrl, useModelActions, useModelState, useModel } from '../../../../src/hook'
import * as Model from './Model'

type Actions = Omit<typeof Model, 'initialState'>

class Hook extends Controller<Model.State, Actions> {
  View = RootView
  Model = Model
  
  constructor(location: Location, context: Context) {
    super(location, context)
  }
}

export default Hook

class RootView extends React.Component<{}> {
  render() {
    return <View />
  }
}

function View() {
  let ctrl = useCtrl<Hook>()
  let model = useModel<Model.State, Actions>()
  let actions = useModelActions<Model.State, Actions>()
  let state = useModelState<Model.State>()
  console.log(model, actions, state)
	return <div id="hook">{ctrl.store.getState().foo}</div>
}
