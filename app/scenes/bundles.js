import async from '~/components/async'

// object key must match chunk name
export default {
  builder: async('Builder', () => import(/* webpackChunkName: "builder" */'./builder/builder-scene.js')),
}
