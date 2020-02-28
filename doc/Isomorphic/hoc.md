# 高阶组件

React-IMVC 提供了高阶组件，可以便利地实现一些特殊需求。

## connect

类型：

```ts
<S extends (props: any) => any>(selector?: S | undefined): With<ReturnType<S>>
```

`connect` 是一个高阶函数，第一次调用时接受 `selector` 函数作为参数，返回 `withData` 函数。

`withData` 函数接受一个 React 组件作为参数，返回新的 React 组件。`withData` 会将 `selector` 函数返回的数据，作为 `props` 传入新的 React 组件。

`selector({ state, ctrl, actions })` 函数将得到一个 `data` 参数，其中包含三个字段 `state`, `ctrl`, `acitons`，分别对应 ctrl 里的 global state, this 和 actions 对象。

```ts
import React from 'react'
import connect from 'react-imvc/hoc/connect'

const withData = connect(({ state }) => {
  return {
    content: state.loadingText
  }
})

export default withData(Loading)

function Loading(props) {
  if (!props.content) {
    return null
  }
  return (
    <div id="wxloading" className="wx_loading">
      <div className="wx_loading_inner">
        <i className="wx_loading_icon" />
        {props.content}
      </div>
    </div>
  )
}
```
