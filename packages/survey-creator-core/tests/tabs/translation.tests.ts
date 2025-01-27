import {
  SurveyModel,
  surveyLocalization,
  Base,
  QuestionDropdownModel,
  PanelModel,
  QuestionMatrixDropdownModel
} from "survey-core";
import {
  Translation,
  TranslationItem,
  TabTranslationPlugin
} from "../../src/components/tabs/translation";
import { CreatorTester } from "../creator-tester";

test("Fire callback on base objects creation", () => {
  var survey = new SurveyModel();
  survey.addNewPage("p1");
  var q = survey.pages[0].addNewQuestion("text", "q1");
  q.title = "some value";
  var cretorHash = {};
  var translation = new Translation(survey, null, (obj: Base) => {
    var type = obj.getType();
    if (!cretorHash[type]) {
      cretorHash[type] = 0;
    }
    cretorHash[type] = cretorHash[type] + 1;
  });
  expect(cretorHash["translation"]).toEqual(1);
  expect(cretorHash["translationgroup"]).toEqual(5);
  expect(cretorHash["translationitem"]).toEqual(2);
  expect(cretorHash["translationitemstring"]).toBeFalsy();
  var group = translation.root.groups[0];
  expect(group.items).toHaveLength(1);
  expect(group.items[0].name).toEqual("q1");
  group = group.groups[0];
  expect(group.items[0].name).toEqual("title");
  var val = group.locItems[0].values("");
  expect(cretorHash["translationitemstring"]).toEqual(1);
});
test("create available locales", () => {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "checkbox",
            name: "question1",
            title: {
              default: "question 1",
              fr: "quéstion 1",
              it: "quéstion 1",
              es: "quéstion 1"
            },
            choices: ["item1", "item2", "item3"]
          }
        ]
      }
    ]
  });
  surveyLocalization.supportedLocales = ["fr", "de"];
  var translation = new Translation(survey);
  expect(translation.settingsSurvey.getValue("selLocales")).toHaveLength(3);
  expect(translation.getSurveyLocales()[0]).toHaveLength(4);
  translation.addLocale("de");
  expect(translation.settingsSurvey.getValue("selLocales")).toHaveLength(4);
  surveyLocalization.supportedLocales = [];
});
test("create locales question", () => {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "checkbox",
            name: "question1",
            title: {
              default: "question 1",
              fr: "quéstion 1",
              it: "quéstion 1",
              es: "quéstion 1"
            },
            choices: ["item1", "item2", "item3"]
          }
        ]
      }
    ]
  });
  surveyLocalization.supportedLocales = ["fr", "de"];
  var translation = new Translation(survey);
  var localesQuestion = <QuestionDropdownModel>(
    translation.settingsSurvey.getQuestionByName("locales")
  );
  expect(localesQuestion.choices).toHaveLength(4);
  var visChoices = localesQuestion.visibleChoices;
  expect(visChoices).toHaveLength(3);
  expect(visChoices[0].value).toEqual("fr");
  expect(visChoices[1].value).toEqual("it");
  expect(visChoices[2].value).toEqual("es");
  expect(localesQuestion.value).toHaveLength(3);
  expect(localesQuestion.value[0]).toEqual("fr");
  expect(localesQuestion.value[1]).toEqual("it");
  expect(localesQuestion.value[2]).toEqual("es");
  surveyLocalization.supportedLocales = [];
});

test("stringsSurvey - one question in survey", () => {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "checkbox",
            name: "question1",
            title: {
              default: "question 1",
              fr: "quéstion 1",
              it: "quéstion 1",
              es: "quéstion 1"
            },
            choices: ["item1", "item2", "item3"]
          }
        ]
      }
    ]
  });
  var translation = new Translation(survey);
  expect(translation.stringsSurvey.pages).toHaveLength(1);
  var page = translation.stringsSurvey.pages[0];
  expect(page.elements).toHaveLength(1);
  var pagePanel = <PanelModel>page.elements[0];
  expect(pagePanel.name).toEqual("page1");
  expect(pagePanel.elements).toHaveLength(1);
  expect(pagePanel.elements[0].name).toEqual("question1");
  var question1 = <PanelModel>pagePanel.elements[0];
  expect(question1.elements).toHaveLength(2);
  var question1Props = <QuestionMatrixDropdownModel>question1.elements[0];
  expect(question1Props.name).toEqual("question1_props");
  expect(question1Props.titleLocation).toEqual("hidden");
  expect(question1Props.columns).toHaveLength(4);
  expect(question1Props.columns[0].name).toEqual("default");
  expect(question1Props.columns[0].title).toEqual("Default (english)");
  expect(question1Props.rows).toHaveLength(1);
  expect(question1Props.rows[0].value).toEqual("title");
  expect(question1Props.rows[0].text).toEqual("Title");
  var choicesPanel = <PanelModel>question1.elements[1];
  var choicesProps = <QuestionMatrixDropdownModel>choicesPanel.elements[0];
  expect(choicesProps.name).toEqual("question1_choices");
  expect(choicesProps.columns).toHaveLength(4);
  expect(choicesProps.columns[0].name).toEqual("default");
  expect(choicesProps.columns[0].title).toEqual("Default (english)");
  expect(choicesProps.columns[1].name).toEqual("fr");
  expect(choicesProps.columns[1].title).toEqual("français");
  expect(choicesProps.rows).toHaveLength(3);
  expect(choicesProps.rows[0].value).toEqual("item1");
  expect(choicesProps.rows[0].text).toEqual("Item 1");
  expect(choicesProps.rows[2].value).toEqual("item3");
  expect(choicesProps.rows[2].text).toEqual("Item 3");
  expect(question1Props.value).toEqual({
    title: {
      default: "question 1",
      fr: "quéstion 1",
      it: "quéstion 1",
      es: "quéstion 1"
    }
  });
  expect(question1Props.visibleRows[0].cells[1].question.getType()).toEqual(
    "comment"
  );
  expect(question1Props.visibleRows[0].cells[1].question.value).toEqual(
    "quéstion 1"
  );
  var translationItem: TranslationItem =
    question1Props.rows[0]["translationData"];
  expect(translationItem.getLocText("fr")).toEqual("quéstion 1");
  question1Props.visibleRows[0].cells[1].question.value = "changed fr";
  expect(translationItem.getLocText("fr")).toEqual("changed fr");
});

test("Add/remove columns on adding/removing locales", () => {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "text",
            name: "question1"
          }
        ]
      },
      {
        name: "page2",
        elements: [
          {
            type: "text",
            name: "question2"
          }
        ]
      }
    ]
  });
  var translation = new Translation(survey);
  var matrix = <QuestionMatrixDropdownModel>(
    translation.stringsSurvey.getAllQuestions()[0]
  );
  expect(matrix.columns).toHaveLength(1);
  translation.addLocale("de");
  expect(matrix.columns).toHaveLength(2);
});
test("stringsSurvey and filterPage", () => {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "text",
            name: "question1",
            title: "Question 1"
          }
        ]
      },
      {
        name: "page2",
        elements: [
          {
            type: "text",
            name: "question2",
            title: "Question 2"
          }
        ]
      }
    ]
  });
  var translation = new Translation(survey);
  expect(translation.stringsSurvey.getAllQuestions()).toHaveLength(2);
  translation.filteredPage = survey.pages[0];
  expect(translation.stringsSurvey.getAllQuestions()).toHaveLength(1);
});
test("stringsSurvey and filterPage + one page", () => {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "text",
            name: "question1",
            title: "Question 1"
          }
        ]
      }
    ]
  });
  var translation = new Translation(survey);
  expect(translation.stringsSurvey.getAllQuestions()).toHaveLength(1);
  translation.filteredPage = survey.pages[0];
  expect(translation.stringsSurvey.getAllQuestions()).toHaveLength(1);
});
test("Translation show All strings and property visibility", () => {
  var creator = new CreatorTester();
  creator.JSON = {
    completedHtml: "Test",
    pages: [
      {
        title: "title1",
        elements: [{ type: "checkbox", name: "question1" }]
      }
    ]
  };
  creator.onShowingProperty.add((sender, options) => {
    options.canShow = options.property.name == "title";
  });
  var tabTranslation = new TabTranslationPlugin(creator);
  tabTranslation.activate();
  var translation = tabTranslation.model.translation;
  expect(translation.root.locItems).toHaveLength(1);
  translation.showAllStrings = true;
  expect(translation.root.locItems).toHaveLength(2);
});
