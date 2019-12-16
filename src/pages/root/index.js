import React, { useEffect, useState } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import EgRenderer from 'react-eg-renderer'
import applyLayout from './network-layout'
import { fetchGraph, fetchTotal } from './api'

const TagChart = ({ data }) => {
  return <ResponsiveBar data={data} keys={['count']} indexBy='tag' />
}

const NetworkChart = ({ data }) => {
  const [layout, setLayout] = useState({ nodes: [], links: [] })
  useEffect(() => {
    applyLayout(data).then((result) => {
      setLayout(result)
    })
  }, [data])
  return (
    <EgRenderer data={layout} node-id-property='id' transitionDuration='500' />
  )
}

const RootPage = () => {
  const [total, setTotal] = useState([])
  const [graph, setGraph] = useState({ nodes: [], links: [] })

  useEffect(() => {
    fetchTotal().then((data) => {
      setTotal(data)
    })
  }, [])

  useEffect(() => {
    fetchGraph().then((data) => {
      setGraph(data)
    })
  }, [])

  return (
    <>
      <div style={{ width: '800px', height: '500px' }}>
        <TagChart data={total} />
      </div>
      <div style={{ width: '800px', height: '800px' }}>
        <NetworkChart data={graph} />
      </div>
    </>
  )
}

export default RootPage
