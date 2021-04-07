export default function login(username: string, password: string) {
  const { gun } = window;

  return new Promise((resolve, reject) => {
    gun.user().auth(username, password, (data: any) => {
      if (data.err) reject(data.err);
      else resolve(data);
    });
  });
}
