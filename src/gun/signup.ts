export default function signup(username: string, password: string) {
  const { gun } = window;

  return new Promise((resolve, reject) => {
    gun.user().create(username, password, (data: any) => {
      if (data.err) reject(data.err);
      else resolve(data);
    });
  });
}
