import axios from 'axios';

export default function getUrl (url: string) {
  return axios.get(url)
}
