import axios from 'axios'
import WP from './WP'

const instance = axios.create({
  baseURL: WP.restURL(),
})

export default instance
