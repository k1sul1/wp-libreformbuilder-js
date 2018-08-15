import axios from 'axios'

const instance = axios.create({
  baseURL: window.WPLFB_URL || 'https://libreformbuilder.local',
})

export default instance
