import {
  ActionBarItem,
  Base,
  IActionBarItem,
  PageModel,
  property,
  SurveyModel
} from "survey-core";
import { ICreatorPlugin, CreatorBase } from "../../creator-base";
import { DragDropHelper } from "../../dragdrophelper";
import { getLocString } from "../../editorLocalization";
import "./designer.scss";

export class TabDesignerViewModel<T extends SurveyModel> extends Base {
  @property() newPage: PageModel;
  @property({ defaultValue: false }) showNewPage: boolean;
  public creator: CreatorBase<T>;

  private createNewPage() {
    const newPage: PageModel = this.survey.createNewPage("");
    this.creator.setNewNames(newPage);
    newPage.onFirstRendering();
    newPage.updateCustomWidgets();
    newPage.setWasShown(true);
    newPage.setSurveyImpl(this.survey);
    newPage["_addToSurvey"] = () => {
      newPage["_addToSurvey"] = undefined;
      this.survey.addPage(newPage);
    };
    this.newPage = newPage;
    DragDropHelper.newGhostPage = newPage;
  }

  constructor(creator: CreatorBase<T>) {
    super();
    this.creator = creator;
  }
  get survey() {
    return this.creator.survey;
  }
  private checkNewPageHandler: (sender: SurveyModel, options: any) => void;
  private surveyOnPropertyChanged: (sender: SurveyModel, options: any) => void;
  public initSurvey() {
    this.checkNewPageHandler = (sender: SurveyModel, options: any) => {
      this.checkNewPage();
    };
    this.surveyOnPropertyChanged = (sender: SurveyModel, options: any) => {
      if (options.name !== "pages") return;
      this.checkNewPage();
    };
    this.survey.onPropertyChanged.add(this.surveyOnPropertyChanged);
    this.survey.onQuestionAdded.add(this.checkNewPageHandler);
    this.survey.onQuestionRemoved.add(this.checkNewPageHandler);
    this.survey.onPanelAdded.add(this.checkNewPageHandler);
    this.survey.onPanelRemoved.add(this.checkNewPageHandler);

    this.checkNewPage();
  }
  public dispose() {
    super.dispose();
    this.survey.onPropertyChanged.remove(this.surveyOnPropertyChanged);
    this.survey.onQuestionAdded.remove(this.checkNewPageHandler);
    this.survey.onQuestionRemoved.remove(this.checkNewPageHandler);
    this.survey.onPanelAdded.remove(this.checkNewPageHandler);
    this.survey.onPanelRemoved.remove(this.checkNewPageHandler);
  }
  private checkNewPage() {
    if (this.canShowNewPage) {
      var pages = this.survey.pages;
      if (
        !this.newPage ||
        (pages.length > 0 && this.newPage === pages[pages.length - 1])
      ) {
        this.createNewPage();
        this.showNewPage = true;
      }
    } else {
      this.showNewPage = false;
      this.newPage = undefined;
    }
  }
  private get canShowNewPage(): boolean {
    if (!this.survey || this.creator.pageEditMode === "single") return false;
    const pages: PageModel[] = this.survey.pages;
    return pages.length === 0 || pages[pages.length - 1].elements.length > 0;
  }
}

export class TabDesignerPlugin<T extends SurveyModel>
  implements ICreatorPlugin
{
  public model: TabDesignerViewModel<T>;
  private undoAction: ActionBarItem;
  private redoAction: ActionBarItem;
  private surveySettingsAction: ActionBarItem;
  constructor(private creator: CreatorBase<T>) {
    this.model = new TabDesignerViewModel<T>(creator);
    creator.tabs.push({
      id: "designer",
      title: getLocString("ed.designer"),
      componentContent: "svc-tab-designer",
      data: this.model,
      action: () => this.creator.makeNewViewActive("designer"),
      active: () => this.creator.viewType === "designer"
    });
    creator.addPlugin("designer", this);
  }
  public activate(): void {}
  public deactivate(): boolean {
    return true;
  }
  public designerSurveyCreated(): void {
    this.model.initSurvey();
    if (!!this.creator.undoRedoManager) {
      this.creator.undoRedoManager.canUndoRedoCallback = () => {
        this.updateUndeRedoActions();
      };
    }
  }
  public createActions(items: Array<IActionBarItem>) {
    this.undoAction = new ActionBarItem({
      id: "icon-undo",
      iconName: "icon-undo",
      title: "Undo",
      showTitle: false,
      visible: () => this.creator.viewType === "designer",
      action: () => this.creator.undo()
    });
    this.redoAction = new ActionBarItem({
      id: "icon-redo",
      iconName: "icon-redo",
      title: "Redo",
      showTitle: false,
      visible: () => this.creator.viewType === "designer",
      action: () => this.creator.redo()
    });
    this.surveySettingsAction = new ActionBarItem({
      id: "icon-settings",
      iconName: "icon-settings",
      needSeparator: true,
      action: () => this.creator.selectElement(this.creator.survey),
      active: this.isSurveySelected,
      visible: () => this.creator.viewType === "designer",
      title: "Settings",
      showTitle: false
    });
    items.push(this.undoAction);
    items.push(this.redoAction);
    items.push(this.surveySettingsAction);
    this.updateUndeRedoActions();
    this.creator.onSelectedElementChanged.add((sender, options) => {
      this.surveySettingsAction.active = this.isSurveySelected;
    });
  }
  private updateUndeRedoActions() {
    if (!this.creator.undoRedoManager) return;
    this.undoAction.active = this.creator.undoRedoManager.canUndo();
    this.redoAction.active = this.creator.undoRedoManager.canRedo();
  }
  private get isSurveySelected(): boolean {
    return this.creator.isElementSelected(<any>this.creator.survey);
  }
}
