import { defineComponent } from 'vue'
import { useCounterStore } from '@/store/counter'

export default defineComponent({
  name: 'App',
  setup() {
    const counter = useCounterStore()

    return () => (
      <div class="app-container">
        <h1>白云学院假条生成器</h1>
        <div class="card">
          <p>这是一个使用 Vite + Vue3 + Pinia + TSX + Less 构建的基础项目。</p>
          <div class="counter-section">
            <p>计数器状态 (Pinia): {counter.count}</p>
            <p>两倍计数: {counter.doubleCount}</p>
            <button onClick={() => counter.increment()}>增加计数</button>
          </div>
        </div>
      </div>
    )
  }
})
