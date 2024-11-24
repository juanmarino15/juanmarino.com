// src/pages/api/jobs/index.ts
export async function get() {
  return {
    body: JSON.stringify({ msg: 'Hello world' }),
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  };
}
