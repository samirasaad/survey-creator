import * as ko from "knockout";
import {
  Question,
  SurveyElement,
  SurveyTemplateRendererTemplateData,
  SurveyTemplateRendererViewModel,
  SurveyModel
} from "survey-core";
import { ImplementorBase } from "survey-knockout-ui";
import { CreatorBase, QuestionAdornerViewModel, toggleHovered } from "@survey/creator";
import { KnockoutMouseEvent, KnockoutDragEvent } from "../events";
//import "./question.scss";
const template = require("./question.html");
// import template from "./question.html";

export class KnockoutQuestionAdornerViewModel extends QuestionAdornerViewModel {
  constructor(
    creator: CreatorBase<SurveyModel>,
    surveyElement: SurveyElement,
    templateData: SurveyTemplateRendererTemplateData
  ) {
    super(creator, surveyElement, templateData);
  }
  koSelect(model: QuestionAdornerViewModel, event: MouseEvent) {
    return super.select(model, this.wrapMouseEvent(event));
  }
  private wrapMouseEvent(event: MouseEvent): KnockoutMouseEvent {
    return new KnockoutMouseEvent(event);
  }
  public hover(event: MouseEvent, element: HTMLElement) {
    toggleHovered(event, element);
  }
}

ko.components.register("svc-question", {
  viewModel: {
    createViewModel: (params: SurveyTemplateRendererViewModel, componentInfo: any) => {
      const creator = params.componentData;
      const question = params.templateData.data;


      const scrollSubscription = ko.computed(() => {
        if (creator.isElementSelected(question)) {
          // componentInfo.element.scrollIntoView();
        }
      });
      const model = new KnockoutQuestionAdornerViewModel(
        params.componentData,
        params.templateData.data as Question,
        params.templateData
      );
      new ImplementorBase(model);
      ko.utils.domNodeDisposal.addDisposeCallback(componentInfo.element, () => {
        scrollSubscription.dispose();
        model.dispose();
      });
      return model;
    },
  },
  template: template,
});
