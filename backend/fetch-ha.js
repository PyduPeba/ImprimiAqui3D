const axios = require('axios');

async function testHA() {
  const haUrl = 'http://192.168.18.240:8123';
  const haToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJiNWE3NGYzYTg0YzI0YTliODA4NWNkNzZlMzVjYTk4MyIsImlhdCI6MTc3Mzc2MzcwNCwiZXhwIjoyMDg5MTIzNzA0fQ.vso09LvHNcoMgk0udlYitN-WRmarc1wQMQqAUQuvSOc';

  try {
    const res = await axios.get(`${haUrl}/api/states`, {
      headers: { Authorization: `Bearer ${haToken}` }
    });
    
    const sensors = res.data.filter(s => 
      s.entity_id.includes('ad5x') || 
      s.entity_id.includes('centauri')
    );
    
    console.log(JSON.stringify(sensors.map(s => ({ id: s.entity_id, state: s.state, attrs: s.attributes })), null, 2));
  } catch (err) {
    console.error('Error fetching HA:', err.message);
  }
}

testHA();
