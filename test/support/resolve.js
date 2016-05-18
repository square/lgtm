export default function resolve(value) {
  return new Promise(accept => accept(value));
}
