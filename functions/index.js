const express = require('express')
const cors = require('cors')
const { BigQuery } = require('@google-cloud/bigquery')

const requestQuery = (query, params) => {
  const bigquery = new BigQuery({
    projectId: 'vdslab-207906'
  })
  return bigquery.query({
    query,
    params,
    location: 'asia-northeast1',
    useLegacySql: false
  })
}

const app = express()
app.use(cors({ origin: true }))

app.get('/tags', (req, res) => {
  const limit = +req.query.limit || 30
  const query = `SELECT
  t.name AS tag,
  COUNT(*) AS count
FROM
  \`vdslab-207906.qiita.items\` s,
  s.tags AS t
GROUP BY
  tag
ORDER BY
  count DESC
LIMIT @limit`

  requestQuery(query, { limit })
    .then(([rows]) => {
      return res.status(200).json(rows)
    })
    .catch((error) => {
      return res.status(500).json(error)
    })
})

app.get('/total', (req, res) => {
  const limit = +req.query.limit || 30
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(2000, 0, 1)
  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date(2100, 0, 1)
  const query = `SELECT
  t.name AS tag,
  COUNT(*) AS count
FROM
  \`vdslab-207906.qiita.items\` s,
  s.tags AS t
WHERE
  created_at BETWEEN @startDate AND @endDate
GROUP BY
  tag
ORDER BY
  count DESC
LIMIT @limit`

  requestQuery(query, { limit, startDate, endDate })
    .then(([rows]) => {
      return res.status(200).json(rows)
    })
    .catch((error) => {
      return res.status(500).json(error)
    })
})

app.get('/graph', (req, res) => {
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(2000, 0, 1)
  const endDate = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date(2100, 0, 1)
  const limit = +req.query.limit || 100
  const query = `CREATE TEMPORARY FUNCTION
  pairs(tags ARRAY<STRUCT<versions ARRAY<String>,
    name String>>)
  RETURNS ARRAY<STRUCT<tag1 String,
  tag2 String>>
  LANGUAGE js AS """
  const result = new Array(tags.length);
  for (let i = 0; i < tags.length; ++i) {
    for (let j = i + 1; j < tags.length; ++j) {
      result.push({
        tag1: tags[i].name,
        tag2: tags[j].name
      })
    }
  }
  return result;
""";
SELECT
  pair.tag1 AS tag1,
  pair.tag2 AS tag2,
  COUNT(*) AS count
FROM
  \`vdslab-207906.qiita.items\` items,
  UNNEST(pairs(items.tags)) pair
WHERE
  created_at BETWEEN @startDate AND @endDate
  AND tag1 IS NOT NULL
  AND tag2 IS NOT NULL
GROUP BY
  tag1,
  tag2
ORDER BY
  count DESC
LIMIT
  @limit`

  requestQuery(query, { startDate, endDate, limit })
    .then(([rows]) => {
      const nodeIds = new Set()
      for (const { tag1, tag2 } of rows) {
        nodeIds.add(tag1)
        nodeIds.add(tag2)
      }

      const nodeSize = new Map()
      const nodeIndex = new Map()
      let index = 0
      for (const tag of nodeIds) {
        nodeSize.set(tag, 0)
        nodeIndex.set(tag, index++)
      }

      for (const { tag1, tag2, count } of rows) {
        nodeSize.set(tag1, nodeSize.get(tag1) + count)
        nodeSize.set(tag2, nodeSize.get(tag2) + count)
      }

      return res.status(200).json({
        nodes: Array.from(nodeIds).map((tag) => ({
          id: nodeIndex.get(tag),
          name: tag,
          count: nodeSize.get(tag)
        })),
        links: rows.map(({ tag1, tag2, count }) => ({
          source: nodeIndex.get(tag1),
          target: nodeIndex.get(tag2),
          count
        }))
      })
    })
    .catch((error) => {
      return res.status(500).json(error)
    })
})

app.get('/monthly', (req, res) => {
  const tags = (req.query.tags || '').split(',')
  const query = `SELECT
  t.name AS tag,
  datetime_TRUNC( DATETIME(created_at,
      "+09:00"),
    MONTH) AS yearMonth,
  COUNT(*) AS count
FROM
  \`vdslab-207906.qiita.items\` s,
  s.tags AS t
WHERE
  t.name IN UNNEST(@tags)
  AND created_at < TIMESTAMP "2019-06-30"
GROUP BY
  tag,
  yearMonth
ORDER BY
  yearMonth,
  tag`

  const groupBy = (items) => {
    const groupedItems = items.reduce((acc, obj) => {
      const key = obj.yearMonth.value
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(obj)
      return acc
    }, {})
    const result = Array.from(Object.entries(groupedItems)).map(
      ([yearMonth, items]) => {
        const obj = { yearMonth }
        for (const { tag, count } of items) {
          obj[tag] = count
        }
        return obj
      }
    )
    result.sort((a, b) => (a.yearMonth < b.yearMonth ? -1 : 1))
    return result
  }

  requestQuery(query, { tags })
    .then(([rows]) => {
      return res.status(200).json(groupBy(rows))
    })
    .catch((error) => {
      return res.status(500).json(error)
    })
})

module.exports = {
  main: app
}
