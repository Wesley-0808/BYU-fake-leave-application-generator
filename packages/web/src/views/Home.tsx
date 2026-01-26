import { computed, defineComponent, ref, reactive } from "vue";
import { useRouter } from "vue-router";
import {
  Button,
  Card,
  DatePicker,
  DateRangePicker,
  Form,
  FormItem,
  Input,
  QRCode,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  TagInput,
} from "tdesign-vue-next";
import {
  calculationTime,
  getClassList,
  getCounselorList,
  getDepartment,
  partySecretaryList,
} from "@byu-flag/utils";

import type { Template } from "@/types";

export default defineComponent({
  name: "Home",
  setup() {
    const router = useRouter();
    const formInstance = ref(null);
    const formData = reactive<Template>({
      modelType: "PC",
      name: "",
      number: "",
      class: "",
      department: "",
      type: "事假",
      time: [],
      reason: "",
      courses: [],
      counselor: "",
      partySecretary: "",
      submitTime: "",
    });

    const requestType = ["事假", "病假", "公假"];

    const classOptions = computed(() => {
      return getClassList();
    });

    const departmentOptions = computed(() => {
      const data = getDepartment();
      return (
        data
          .map((dept) => {
            if (dept.value === "学生") {
              return dept;
            }
          })
          .filter(Boolean)?.[0]?.children || []
      );
    });

    const counselorOptions = computed(() => {
      const data = getCounselorList();
      return data.map((user) => ({
        value: `${user.id}`,
        label: `${user.department} - ${user.name}(${user.position})`,
      }));
    });

    const partySecretaryOptions = computed(() => {
      const data = partySecretaryList();
      return data.map((user) => ({
        value: `${user.id}`,
        label: `${user.department} - ${user.name}(${user.position})`,
      }));
    });

    const timeRangeStatus = computed(() => {
      const data = calculationTime(formData.time?.[0], formData.time?.[1]);
      return {
        disabled: data.disabled,
        type: data.type,
        label: data.disabled ? `${data.label}(超出时间范围)` : data.label,
      };
    });

    const goGenerator = () => {
      router.push({
        path: "/generator",
        query: {
          template: JSON.stringify({ ...formData, timestamp: Date.now() }),
        },
      });
    };

    return () => (
      <div class="container">
        <Card title="白云学院假条生成器" header-bordered>
          <Form
            ref={formInstance}
            data={formData}
            resetType="initial"
            labelAlign="left"
            colon
            onSubmit={() => {
              goGenerator();
            }}
          >
            <FormItem label="模版类型" name="modelType">
              <RadioGroup variant="default-filled" v-model={formData.modelType}>
                <RadioButton value="PC">PC</RadioButton>
                <RadioButton value="mobile">移动端</RadioButton>
              </RadioGroup>
            </FormItem>
            <FormItem label="姓名" name="name">
              <Input v-model={formData.name} />
            </FormItem>
            <FormItem label="学号" name="number">
              <Input v-model={formData.number} />
            </FormItem>
            <FormItem label="班级" name="class">
              <Select
                v-model={formData.class}
                options={classOptions.value}
                filterable
                clearable
              />
            </FormItem>
            <FormItem label="院系" name="department">
              <Select
                v-model={formData.department}
                options={departmentOptions.value}
                filterable
                clearable
              />
            </FormItem>
            <FormItem label="请假类别" name="type">
              <RadioGroup variant="default-filled" v-model={formData.type}>
                {requestType.map((type) => (
                  <RadioButton value={type}>{type}</RadioButton>
                ))}
              </RadioGroup>
            </FormItem>
            <FormItem label="请假时间" name="time">
              <DateRangePicker
                v-model={formData.time}
                enable-time-picker
                allow-input
                clearable
                tips={timeRangeStatus.value.label}
                status={timeRangeStatus.value.disabled ? "error" : "default"}
              />
            </FormItem>
            <FormItem label="请假事由" name="reason">
              <Input v-model={formData.reason} />
            </FormItem>
            <FormItem label="涉及课程" name="courses">
              <TagInput v-model={formData.courses} />
            </FormItem>
            <FormItem label="辅导员" name="counselor">
              <Select
                v-model={formData.counselor}
                options={counselorOptions.value}
                filterable
                clearable
              />
            </FormItem>
            {timeRangeStatus.value.type === 2 && (
              <FormItem
                label="学院党组织书记"
                name="partySecretary"
                labelWidth={130}
              >
                <Select
                  v-model={formData.partySecretary}
                  options={partySecretaryOptions.value}
                  filterable
                  clearable
                />
              </FormItem>
            )}
            <FormItem label="提交时间" name="submitTime">
              <DatePicker
                v-model={formData.submitTime}
                enable-time-picker
                allow-input
                clearable
              />
            </FormItem>
            <FormItem label="快速查看">
              <QRCode
                level="M"
                size={200}
                value={`https://byu-flag.wwen.work/#/generator?template=${JSON.stringify({ ...formData, timestamp: Date.now() })}`}
              />
            </FormItem>
            <FormItem>
              <Space>
                <Button theme="primary" type="submit" style="width: 120px;">
                  提交
                </Button>
                <Button
                  theme="default"
                  variant="base"
                  type="reset"
                  style="width: 120px;"
                >
                  重置
                </Button>
              </Space>
            </FormItem>
          </Form>
        </Card>
      </div>
    );
  },
});
