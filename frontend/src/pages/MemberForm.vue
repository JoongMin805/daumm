<template>
  <div class="reg_frm-wrap">
    <h1 class="tit">{{ isEdit ? "일정 수정" : "회원 등록" }}</h1>
    <div class="reg_frm-area">
      <form @submit.prevent="submit">
        <div class="frm">
          <input type="text" v-model="form.member_name" placeholder="이름" />
        </div>
        <div class="frm">
          <input type="text" v-model="form.addr" placeholder="거주지" />
        </div>
        <div class="radio-area">
          <span class="frm-radio"><input type="radio" id="gender_m" name="gender" v-model="form.gender" value="man"><label for="gender_m">남</label></span>
          <span class="frm-radio"><input type="radio" id="gender_w" name="gender" v-model="form.gender" value="woman"><label for="gender_w">여</label></span>
        </div>
        <div class="datepicker">
          <VueDatePicker v-model="form.birth" placeholder="생년월일(YYMMDD)" :auto-apply="true" :enable-time-picker="false" :formats="{ input: 'yyMMdd' }" maxlength="6"/>
        </div>
        <div class="datepicker">
          <VueDatePicker v-model="form.regist_date" placeholder="가입일(YYMMDD)" :auto-apply="true" :enable-time-picker="false" :formats="{ input: 'yyMMdd' }" />
        </div>
        <div class="manage">
          <span class="frm-checkbox">
            <input v-model="form.manage" type="checkbox" id="manage" true-value="Y" false-value="" />
            <label for="manage">운영진</label>
          </span>
        </div>
        <div class="btn-area">
          <button type="button" @click="$router.push('/member_list/')" class="btn-cancel">취소</button>
          <button type="submit" :disabled="loading">{{ isEdit ? "수정" : "등록" }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getMember, createMember, updateMember } from "@/api/members";
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

const route = useRoute();
const router = useRouter();

const isEdit = computed(() => !!route.params.id);
const loading = ref(false);

const form = reactive({
  member_name: "",
  participation: "",
  birth: "",
  regist_date: "",
  manage: "",
  gender: "",
  addr: "",
});

const normalize = (v) => String(v || "").toLowerCase()
const toModelGender = (v) => {
  const n = normalize(v)
  if (n === "man" || n === "m" || n.startsWith("남")) return "man"
  if (n === "woman" || n === "w" || n.startsWith("여")) return "woman"
  return ""
}

onMounted(async () => {
  if (isEdit.value) {
    try {
        const res = await getMember(route.params.id);
        form.member_name = res.data.member_name || "";
        form.participation = res.data.participation || "";
        form.birth = res.data.birth || "";
        form.regist_date = res.data.regist_date || "";
        form.manage = res.data.manage === "Y" ? "Y" : "";     
        form.gender = toModelGender(res.data.gender);
        form.addr = res.data.addr || "";
    } catch (err) {
      console.error(err);
      console.log("회원 정보를 불러오는 중 오류 발생");
      // router.push("/member_list/");
    }
  }
});

const submit = async () => {
  loading.value = true;
  try {
    const payload = { ...form, manage: form.manage };
    console.log("전송 데이터:", payload);

    if (isEdit.value) await updateMember(route.params.id, payload);
    else await createMember(payload);

    alert(isEdit.value ? "회원 수정 완료" : "회원 등록 완료");
    router.push("/member_list/");
  } catch (err) {
    console.error("API 오류:", err);
    alert("등록/수정 중 오류 발생: " + err.message);
  } finally {
    loading.value = false;
  }
};
</script>
