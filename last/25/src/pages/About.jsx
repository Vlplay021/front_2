export default function About() {
  return (
    <div>
      <h1>О нас</h1>
      <p>Этот компонент загружается лениво (lazy loading). Его код вынесен в отдельный чанк.</p>
      <p>Откройте вкладку Network в DevTools — About.jsx подгрузится только при переходе на страницу.</p>
    </div>
  )
}