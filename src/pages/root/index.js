import React, { memo, useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import applyLayout from './network-layout'
import { fetchGraph, fetchMonthly, fetchTags, fetchTotal } from './api'

const SvgFigure = ({ children, width, height }) => {
  return (
    <figure
      className='image'
      style={{
        margin: 0,
        paddingTop: `${((height / width) * 100).toFixed()}%`
      }}
    >
      <svg
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        }}
        viewBox={`0,0,${width},${height}`}
      >
        {children}
      </svg>
    </figure>
  )
}

const TagChart = ({
  data: rawData,
  tags,
  baseOpacity,
  transparentOpacity,
  highlightOpacity,
  selectedTag,
  setSelectedTag
}) => {
  const data = Array.from(rawData)
  data.sort((a, b) => b.count - a.count)

  const margin = { top: 50, right: 30, bottom: 50, left: 100 }
  const barHeight = 20
  const barMargin = 10
  const contentWidth = 500 - margin.right - margin.left
  const contentHeight = (barMargin + barHeight) * data.length
  const tickLength = 10

  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, ({ count }) => count)])
    .range([0, contentWidth])
    .nice()
  const yScale = d3
    .scaleLinear()
    .domain([0, data.length])
    .range([0, contentHeight])
  const colors = new Map(tags.map(({ tag, color }) => [tag, color]))

  return (
    <SvgFigure
      width={margin.right + margin.left + contentWidth}
      height={margin.top + margin.bottom + contentHeight}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <g>
          {xScale.ticks(5).map((x, i) => {
            return (
              <g key={i} transform={`translate(${xScale(x)},0)`}>
                <line
                  x1='0'
                  y1='0'
                  x2='0'
                  y2={contentHeight + tickLength}
                  stroke='#ccc'
                />
                <text
                  y={contentHeight + tickLength}
                  textAnchor='middle'
                  dominantBaseline='text-before-edge'
                >
                  {x}
                </text>
              </g>
            )
          })}
        </g>
        <g>
          {data.map(({ tag, count }, i) => {
            return (
              <g
                key={tag}
                style={{
                  transitionDuration: '1s',
                  transitionProperty: 'transform'
                }}
                transform={`translate(0,${yScale(i) +
                  (barMargin + barHeight) / 2})`}
              >
                <rect
                  className='pointer'
                  style={{
                    transitionDuration: '1s',
                    transitionProperty: 'width'
                  }}
                  x='0'
                  y={-barHeight / 2}
                  width={xScale(count)}
                  height={barHeight}
                  fill={colors.get(tag) || '#ccc'}
                  opacity={
                    selectedTag == null
                      ? baseOpacity
                      : tag === selectedTag
                      ? highlightOpacity
                      : transparentOpacity
                  }
                  onClick={() => {
                    if (selectedTag === tag) {
                      setSelectedTag(null)
                    } else {
                      setSelectedTag(tag)
                    }
                  }}
                  onMouseOver={() => {
                    setSelectedTag(tag)
                  }}
                  onMouseLeave={() => {
                    setSelectedTag(null)
                  }}
                />
                <line x1='0' y1='0' x2={-tickLength} y2='0' stroke='#ccc' />
                <text
                  x={-tickLength}
                  textAnchor='end'
                  dominantBaseline='central'
                >
                  {tag}
                </text>
              </g>
            )
          })}
        </g>
      </g>
    </SvgFigure>
  )
}

const NetworkChart = memo(
  ({
    data,
    tags,
    baseOpacity,
    transparentOpacity,
    highlightOpacity,
    selectedTag,
    setSelectedTag
  }) => {
    const margin = 50
    const contentWidth = 600
    const contentHeight = 600
    const width = contentWidth + margin * 2
    const height = contentHeight + margin * 2

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data.nodes, (node) => node.x))
      .range([0, contentWidth])
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data.nodes, (node) => node.y))
      .range([0, contentHeight])
    const sizeScale = d3
      .scaleSqrt()
      .domain(d3.extent(data.nodes, (node) => node.count))
      .range([10, 30])
    const fontSizeScale = d3
      .scaleSqrt()
      .domain(d3.extent(data.nodes, (node) => node.count))
      .range([6, 16])
    const colors = new Map(tags.map(({ tag, color }) => [tag, color]))

    const nodes = new Map(data.nodes.map((node) => [node.id, node]))
    return (
      <SvgFigure width={width} height={height}>
        <g transform={`translate(${margin},${margin})`}>
          <g>
            {data.links.map((link) => {
              const sourceNode = nodes.get(link.source)
              const targetNode = nodes.get(link.target)
              return (
                <g key={`${sourceNode.name}:${targetNode.name}`}>
                  <line
                    style={{
                      transitionDuration: '1s',
                      transitionProperty: 'x1,y1,x2,y2'
                    }}
                    x1={xScale(nodes.get(link.source).x)}
                    y1={yScale(nodes.get(link.source).y)}
                    x2={xScale(nodes.get(link.target).x)}
                    y2={yScale(nodes.get(link.target).y)}
                    stroke='#ccc'
                  />
                </g>
              )
            })}
          </g>
          <g>
            {data.nodes.map((node) => {
              return (
                <g
                  key={node.name}
                  className='pointer'
                  style={{
                    transitionDuration: '1s',
                    transitionProperty: 'transform'
                  }}
                  transform={`translate(${xScale(node.x)},${yScale(node.y)})`}
                  opacity={
                    selectedTag == null
                      ? baseOpacity
                      : node.name === selectedTag
                      ? highlightOpacity
                      : transparentOpacity
                  }
                  onClick={() => {
                    if (selectedTag === node.name) {
                      setSelectedTag(null)
                    } else {
                      setSelectedTag(node.name)
                    }
                  }}
                  onMouseOver={() => {
                    setSelectedTag(node.name)
                  }}
                  onMouseLeave={() => {
                    setSelectedTag(null)
                  }}
                >
                  <circle
                    r={sizeScale(node.count)}
                    fill={colors.get(node.name) || '#ccc'}
                  />
                  <text
                    fontSize={fontSizeScale(node.count)}
                    textAnchor='middle'
                    dominantBaseline='central'
                  >
                    {node.name}
                  </text>
                </g>
              )
            })}
          </g>
        </g>
      </SvgFigure>
    )
  }
)

const MonthlyAreaChart = ({
  data: rawData,
  tags,
  baseOpacity,
  transparentOpacity,
  highlightOpacity,
  selectedTag,
  setDateRange,
  setSelectedTag
}) => {
  const keys = tags.map(({ tag }) => tag)
  const data = rawData.map((item) => {
    const obj = Object.assign({}, item)
    for (const key of keys) {
      if (!obj[key]) {
        obj[key] = 0
      }
    }
    return obj
  })
  const stack = d3
    .stack()
    .keys(keys)
    .order(d3.stackOrderDescending)
    .offset(d3.stackOffsetNone)
  const series = stack(data)

  const margin = { top: 10, right: 60, bottom: 50, left: 60 }
  const contentWidth = 1500 - margin.right - margin.left
  const contentHeight = 400 - margin.top - margin.bottom
  const tickLength = 10

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, ({ yearMonth }) => new Date(yearMonth)))
    .range([0, contentWidth])
    .nice()
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(series, (d) => d3.max(d, ([_, v]) => v))])
    .range([contentHeight, 0])
    .nice()
  const colors = new Map(tags.map(({ tag, color }) => [tag, color]))
  const timeFormat = d3.timeFormat('%Y%m')

  const area = d3
    .area()
    .x((d) => xScale(new Date(d.data.yearMonth)))
    .y1((d) => yScale(d[1]))
    .y0((d) => yScale(d[0]))

  const ref = useRef()
  useEffect(() => {
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [contentWidth, contentHeight]
      ])
      .on('end', () => {
        if (d3.event.selection) {
          const [x0, x1] = d3.event.selection
          setDateRange({
            start: new Date(xScale.invert(x0)),
            end: new Date(xScale.invert(x1))
          })
        } else {
          setDateRange(null)
        }
      })
    d3.select(ref.current).call(brush)
  }, [contentWidth, contentHeight, xScale, setDateRange])

  return (
    <SvgFigure
      width={margin.right + margin.left + contentWidth}
      height={margin.top + margin.bottom + contentHeight}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <g>
          {xScale.ticks().map((x, i) => {
            return (
              <g key={i} transform={`translate(${xScale(x)},0)`}>
                <line
                  x1='0'
                  y1='0'
                  x2='0'
                  y2={contentHeight + tickLength}
                  stroke='#ccc'
                />
                <text
                  x='0'
                  y={contentHeight + tickLength}
                  textAnchor='middle'
                  dominantBaseline='text-before-edge'
                >
                  {timeFormat(x)}
                </text>
              </g>
            )
          })}
        </g>
        <g>
          {yScale.ticks().map((y, i) => {
            return (
              <g key={i} transform={`translate(0,${yScale(y)})`}>
                <line
                  x1={-tickLength}
                  y1='0'
                  x2={contentWidth}
                  y2='0'
                  stroke='#ccc'
                />
                <text
                  x={-tickLength}
                  y='0'
                  textAnchor='end'
                  dominantBaseline='central'
                >
                  {y}
                </text>
              </g>
            )
          })}
        </g>
        <g ref={ref}>
          {series.map((s) => {
            return (
              <g key={s.key}>
                <path
                  className='pointer'
                  style={{
                    transitionDuration: '1s',
                    transitionProperty: 'd'
                  }}
                  d={area(s)}
                  fill={colors.get(s.key)}
                  opacity={
                    selectedTag == null
                      ? baseOpacity
                      : s.key === selectedTag
                      ? highlightOpacity
                      : transparentOpacity
                  }
                  onClick={() => {
                    if (selectedTag === s.key) {
                      setSelectedTag(null)
                    } else {
                      setSelectedTag(s.key)
                    }
                  }}
                  onMouseOver={() => {
                    setSelectedTag(s.key)
                  }}
                  onMouseLeave={() => {
                    setSelectedTag(null)
                  }}
                >
                  <title>{s.key}</title>
                </path>
              </g>
            )
          })}
        </g>
      </g>
    </SvgFigure>
  )
}

const MonthlyLineChart = ({
  data: rawData,
  tags,
  baseOpacity,
  transparentOpacity,
  highlightOpacity,
  selectedTag,
  setDateRange,
  setSelectedTag
}) => {
  const keys = tags.map(({ tag }) => tag)
  const data = rawData.map((item) => {
    const obj = Object.assign({}, item)
    for (const key of keys) {
      if (!obj[key]) {
        obj[key] = 0
      }
    }
    return obj
  })

  const margin = { top: 10, right: 60, bottom: 50, left: 60 }
  const contentWidth = 1500 - margin.right - margin.left
  const contentHeight = 400 - margin.top - margin.bottom
  const tickLength = 10

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data, ({ yearMonth }) => new Date(yearMonth)))
    .range([0, contentWidth])
    .nice()
  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(keys, (key) => d3.max(data, (item) => item[key]))])
    .range([contentHeight, 0])
    .nice()
  const colors = new Map(tags.map(({ tag, color }) => [tag, color]))
  const timeFormat = d3.timeFormat('%Y%m')

  const ref = useRef()
  useEffect(() => {
    const brush = d3
      .brushX()
      .extent([
        [0, 0],
        [contentWidth, contentHeight]
      ])
      .on('end', () => {
        if (d3.event.selection) {
          const [x0, x1] = d3.event.selection
          setDateRange({
            start: new Date(xScale.invert(x0)),
            end: new Date(xScale.invert(x1))
          })
        } else {
          setDateRange(null)
        }
      })
    d3.select(ref.current).call(brush)
  }, [contentWidth, contentHeight, xScale, setDateRange])

  return (
    <SvgFigure
      width={margin.right + margin.left + contentWidth}
      height={margin.top + margin.bottom + contentHeight}
    >
      <g transform={`translate(${margin.left},${margin.top})`}>
        <g>
          {xScale.ticks().map((x, i) => {
            return (
              <g key={i} transform={`translate(${xScale(x)},0)`}>
                <line
                  x1='0'
                  y1='0'
                  x2='0'
                  y2={contentHeight + tickLength}
                  stroke='#ccc'
                />
                <text
                  x='0'
                  y={contentHeight + tickLength}
                  textAnchor='middle'
                  dominantBaseline='text-before-edge'
                >
                  {timeFormat(x)}
                </text>
              </g>
            )
          })}
        </g>
        <g>
          {yScale.ticks().map((y, i) => {
            return (
              <g key={i} transform={`translate(0,${yScale(y)})`}>
                <line
                  x1={-tickLength}
                  y1='0'
                  x2={contentWidth}
                  y2='0'
                  stroke='#ccc'
                />
                <text
                  x={-tickLength}
                  y='0'
                  textAnchor='end'
                  dominantBaseline='central'
                >
                  {y}
                </text>
              </g>
            )
          })}
        </g>
        <g ref={ref}>
          {keys.map((key) => {
            const line = d3
              .line()
              .x((d) => xScale(new Date(d.yearMonth)))
              .y((d) => yScale(d[key]))
            return (
              <g key={key}>
                <path
                  className='pointer'
                  style={{
                    transitionDuration: '1s',
                    transitionProperty: 'd'
                  }}
                  d={line(data)}
                  fill='none'
                  stroke={colors.get(key)}
                  strokeWidth='3'
                  opacity={
                    selectedTag == null
                      ? baseOpacity
                      : key === selectedTag
                      ? highlightOpacity
                      : transparentOpacity
                  }
                  onClick={() => {
                    if (selectedTag === key) {
                      setSelectedTag(null)
                    } else {
                      setSelectedTag(key)
                    }
                  }}
                  onMouseOver={() => {
                    setSelectedTag(key)
                  }}
                  onMouseLeave={() => {
                    setSelectedTag(null)
                  }}
                >
                  <title>{key}</title>
                </path>
              </g>
            )
          })}
        </g>
      </g>
    </SvgFigure>
  )
}

const RootPage = () => {
  const [selectedTag, setSelectedTag] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [tags, setTags] = useState([])
  const [total, setTotal] = useState([])
  const [graph, setGraph] = useState({ nodes: [], links: [] })
  const [monthly, setMonthly] = useState([])

  useEffect(() => {
    fetchTags().then((data) => {
      const colorScale = d3
        .scaleSequential()
        .domain([0, data.length - 1])
        .interpolator(d3.interpolateRainbow)
      data.forEach((item, i) => {
        item.color = colorScale((i * 7) % data.length)
      })
      setTags(data)
    })
  }, [])

  useEffect(() => {
    fetchTotal({
      limit: 30,
      startDate: dateRange == null ? '' : new Date(dateRange.start),
      endDate: dateRange == null ? '' : new Date(dateRange.end)
    }).then((data) => {
      setTotal(data)
    })
  }, [dateRange])

  useEffect(() => {
    fetchGraph({
      startDate: dateRange == null ? '' : new Date(dateRange.start),
      endDate: dateRange == null ? '' : new Date(dateRange.end)
    })
      .then((data) => applyLayout(data))
      .then((data) => {
        setGraph(data)
      })
  }, [dateRange])

  useEffect(() => {
    fetchMonthly({ tags: tags.map(({ tag }) => tag) }).then((data) => {
      setMonthly(data)
    })
  }, [tags])

  const baseOpacity = 0.8
  const transparentOpacity = 0.1
  const highlightOpacity = 1

  return (
    <>
      <div className='columns'>
        <div className='column is-12'>
          <div className='tags'>
            {tags.map(({ tag, color }) => {
              return (
                <a
                  key={tag}
                  className='tag'
                  style={{ color, fontWeight: '700' }}
                  href={`https://qiita.com/tags/${tag}`}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  {tag}
                </a>
              )
            })}
          </div>
        </div>
      </div>
      <div className='columns'>
        <div className='column is-8'>
          <NetworkChart
            data={graph}
            tags={tags}
            baseOpacity={baseOpacity}
            transparentOpacity={transparentOpacity}
            highlightOpacity={highlightOpacity}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        </div>
        <div className='column is-4'>
          <TagChart
            data={total}
            tags={tags}
            baseOpacity={baseOpacity}
            transparentOpacity={transparentOpacity}
            highlightOpacity={highlightOpacity}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
        </div>
      </div>
      <div className='columns'>
        <div className='column is-12'>
          <MonthlyAreaChart
            data={monthly}
            tags={tags}
            baseOpacity={baseOpacity}
            transparentOpacity={transparentOpacity}
            highlightOpacity={highlightOpacity}
            selectedTag={selectedTag}
            setDateRange={setDateRange}
            setSelectedTag={setSelectedTag}
          />
        </div>
      </div>
      <div className='columns'>
        <div className='column is-12'>
          <MonthlyLineChart
            data={monthly}
            tags={tags}
            baseOpacity={baseOpacity}
            transparentOpacity={transparentOpacity}
            highlightOpacity={highlightOpacity}
            selectedTag={selectedTag}
            setDateRange={setDateRange}
            setSelectedTag={setSelectedTag}
          />
        </div>
      </div>
    </>
  )
}

export default RootPage
