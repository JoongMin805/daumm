<template>
  <div class="reg_frm-wrap">
    <h1>{{ isEdit ? "일정 수정" : "일정 등록" }}</h1>

    <div class="reg_frm-area">
      <form @submit.prevent="submit">
        <div class="frm">
          <input type="text" v-model="form.title" placeholder="제목" />
        </div>
        <div class="datepicker">
          <VueDatePicker v-model="form.date" placeholder="날짜(YYMMDD)" :auto-apply="true" :enable-time-picker="false" :formats="{ input: 'yyMMdd' }"/>
        </div>

        <div class="leader_selc-area">
          <div class="frm">
            <span>남: </span>
            <select v-model="form.leader_id" placeholder="(남) 벙주를 선택하세요.">
              <option value="">벙주를 선택하세요.</option>
              <option v-for="m in sortedMen" :value="m._id" :key="m._id">{{ m.member_name }}</option>
            </select>
          </div>
          <div class="frm">
            <span>여: </span>
            <select v-model="form.leader_id" placeholder="(여) 벙주를 선택하세요.">
              <option value="">벙주를 선택하세요.</option>
              <option v-for="m in sortedWomen" :value="m._id" :key="m._id">{{ m.member_name }}</option>
            </select>
          </div>
        </div>

        <div class="schedule_info-wrap">
          <h3>참여자</h3>
          <div v-if="members.length" class="mem-list">
            <span class="frm-checkbox" v-for="m in sortedMembers" :key="m._id">
              <input :id="`choice_${m._id}`" type="checkbox" :value="m._id" v-model="selectedIds" /><label :for="`choice_${m._id}`">{{ m.member_name }}</label>
            </span>
          </div>
          <div class="no_data" v-else>
            <p>회원 목록을 불러오는 중이거나 없습니다.</p>
          </div>

          <div class="btn_confirm-area">
            <button type="button" @click="clearSelection" class="btn-cancel">선택 해제</button>
            <button type="button" @click="confirmSelection">확인</button>
          </div>

          <div class="schedule_member-info">
            <strong>참여자 확인 : </strong>
            <span>{{ participantsPreview }}</span>
          </div>
        </div>

        <div class="btm_btn-area">
          <button type="button" @click="$router.push('/schedule')" class="btn-cancel">취소</button>
          <button type="submit" :disabled="loading">{{ isEdit ? "수정" : "등록" }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMembers } from '@/api/members'
import { getSchedule, createSchedule, updateSchedule } from '@/api/schedules'
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)
const loading = ref(false)

const form = reactive({
  title: '',
  date: '',
  participants: [], // [{id, name}]
  leader_id: '',
  leader_name: ''
})

const members = ref([])
const selectedIds = ref([])

const loadMembers = async () => {
  const res = await getMembers()
  members.value = res.data
}

const sortedMembers = computed(() => {
  return [...members.value].sort((a, b) => {
    const an = a?.member_name || ''
    const bn = b?.member_name || ''
    return an.localeCompare(bn, 'ko', { sensitivity: 'base' })
  })
})

const normalize = (v) => String(v || '').toLowerCase()
const isManGender = (v) => {
  const n = normalize(v)
  return n === 'man' || n === 'm' || n.startsWith('남')
}
const isWomanGender = (v) => {
  const n = normalize(v)
  return n === 'woman' || n === 'w' || n.startsWith('여')
}
const sortedMen = computed(() => sortedMembers.value.filter(m => isManGender(m.gender)))
const sortedWomen = computed(() => sortedMembers.value.filter(m => isWomanGender(m.gender)))

const loadSchedule = async () => {
  if (!isEdit.value) return
  const res = await getSchedule(route.params.id)
  form.title = res.data.title || ''
  form.date = res.data.date || ''
  form.participants = Array.isArray(res.data.participants) ? res.data.participants : []
  form.leader_id = res.data.leader_id || ''
  form.leader_name = res.data.leader_name || ''
  selectedIds.value = form.leader_id ? [form.leader_id] : (form.participants.map(p => p.id).filter(Boolean))
}

onMounted(async () => {
  await loadMembers()
  await loadSchedule()
})

const ensureParticipantsFromSelection = () => {
  const mapById = new Map(members.value.map(m => [m._id, m.member_name]))
  const toYYMMDD = (val) => {
    if (!val) return ''
    if (typeof val === 'string') {
      if (/^\d{6}$/.test(val)) return val
      const d = new Date(val)
      if (isNaN(d)) return ''
      const yy = String(d.getFullYear()).slice(2)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}${mm}${dd}`
    }
    if (val instanceof Date) {
      const yy = String(val.getFullYear()).slice(2)
      const mm = String(val.getMonth() + 1).padStart(2, '0')
      const dd = String(val.getDate()).padStart(2, '0')
      return `${yy}${mm}${dd}`
    }
    return ''
  }
  form.participants = selectedIds.value.map(id => ({
    id,
    name: mapById.get(id) || '',
    date: toYYMMDD(form.date)
  }))
}

const confirmSelection = () => {
  const mapById = new Map(members.value.map(m => [m._id, m.member_name]))
  const toYYMMDD = (val) => {
    if (!val) return ''
    if (typeof val === 'string') {
      if (/^\d{6}$/.test(val)) return val
      const d = new Date(val)
      if (isNaN(d)) return ''
      const yy = String(d.getFullYear()).slice(2)
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yy}${mm}${dd}`
    }
    if (val instanceof Date) {
      const yy = String(val.getFullYear()).slice(2)
      const mm = String(val.getMonth() + 1).padStart(2, '0')
      const dd = String(val.getDate()).padStart(2, '0')
      return `${yy}${mm}${dd}`
    }
    return ''
  }
  form.participants = selectedIds.value.map(id => ({
    id,
    name: mapById.get(id) || '',
    date: toYYMMDD(form.date)
  }))
  if (form.leader_id) {
    form.leader_name = mapById.get(form.leader_id) || ''
  }
}

const clearSelection = () => {
  selectedIds.value = []
  form.participants = []
}

// leader 선택 시 체크박스 자동 반영 및 이름 설정
watch(() => form.leader_id, (val) => {
  if (!val) return
  selectedIds.value = [val]
  const m = members.value.find(x => x._id === val)
  form.leader_name = m ? m.member_name : ''
})

const participantsPreview = computed(() => form.participants.map(p => p.name).join(', '))

const submit = async () => {
  loading.value = true
  try {
    if (!String(form.title || '').trim()) {
      alert('제목을 입력하세요')
      loading.value = false
      return
    }
    if (!form.participants.length && selectedIds.value.length) {
      ensureParticipantsFromSelection()
    }
    if (form.participants.some(p => !String(p.name || '').trim())) {
      alert('선택된 참여자의 이름 정보가 없습니다. 확인 후 다시 시도하세요.')
      loading.value = false
      return
    }
    // leader_name 보강 설정
    if (form.leader_id) {
      const m = members.value.find(x => x._id === form.leader_id)
      form.leader_name = m ? m.member_name : ''
    } else {
      form.leader_name = ''
    }
    const toYYMMDD = (val) => {
      if (!val) return ''
      if (typeof val === 'string') {
        if (/^\d{6}$/.test(val)) return val
        const d = new Date(val)
        if (isNaN(d)) return ''
        const yy = String(d.getFullYear()).slice(2)
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yy}${mm}${dd}`
      }
      if (val instanceof Date) {
        const yy = String(val.getFullYear()).slice(2)
        const mm = String(val.getMonth() + 1).padStart(2, '0')
        const dd = String(val.getDate()).padStart(2, '0')
        return `${yy}${mm}${dd}`
      }
      return ''
    }
    const payload = { ...form, date: toYYMMDD(form.date) }
    if (isEdit.value) await updateSchedule(route.params.id, payload)
    else await createSchedule(payload)
    alert(isEdit.value ? '수정완료' : '등록완료')
    router.push('/schedule')
  } catch (err) {
    console.error(err)
    alert('등록/수정 중 오류 발생: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>
