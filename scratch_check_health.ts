import axios from 'axios';

async function main() {
  try {
    const res = await axios.get('http://localhost:8000/api/health');
    console.log('STATUS:', res.status);
    console.log('HEADERS:', res.headers);
    console.log('DATA:', res.data);
  } catch (err: any) {
    console.log('ERROR STATUS:', err.response?.status);
    console.log('ERROR HEADERS:', err.response?.headers);
    console.log('ERROR DATA:', err.response?.data);
  }
}

main();
